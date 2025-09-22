#!/usr/bin/env python3
"""
Enhanced restart wrapper for the CT job scraper with progress tracking and resume functionality.
"""

import os
import sys
import time
import json
import signal
import subprocess
import threading
from datetime import datetime
from typing import Dict, Any

class ScraperRestartManager:
    """Manages scraper restarts with progress tracking and timeout detection."""
    
    def __init__(self):
        self.progress_file = "scraper_progress.json"
        self.scraper_script = "improved_ct_scraper_fixed.py"
        self.is_running = False
        self.current_process = None
        self.start_time = time.time()
        self.max_total_runtime = 4 * 60 * 60  # 4 hours
        self.max_single_run_time = 2 * 60 * 60  # 2 hours per run
        self.restart_delay = 60  # 1 minute between restarts
        
        # Setup signal handlers
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
    
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals gracefully."""
        print(f"\n🛑 Received signal {signum}, shutting down gracefully...")
        self.is_running = False
        if self.current_process:
            try:
                self.current_process.terminate()
                self.current_process.wait(timeout=10)
            except:
                try:
                    self.current_process.kill()
                except:
                    pass
        sys.exit(0)
    
    def load_progress(self) -> Dict[str, Any]:
        """Load progress from file if it exists."""
        if os.path.exists(self.progress_file):
            try:
                with open(self.progress_file, 'r', encoding='utf-8') as f:
                    progress = json.load(f)
                print(f"📂 Loaded progress: {progress.get('current_site_name', 'Unknown')} - {progress.get('total_jobs_scraped', 0)} jobs")
                return progress
            except Exception as e:
                print(f"⚠️ Could not load progress: {e}")
        return {}
    
    def save_progress(self, progress: Dict[str, Any]):
        """Save progress to file."""
        try:
            progress['last_save_time'] = datetime.now().isoformat()
            with open(self.progress_file, 'w', encoding='utf-8') as f:
                json.dump(progress, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"❌ Error saving progress: {e}")
    
    def check_timeout(self) -> bool:
        """Check if total runtime has been exceeded."""
        elapsed = time.time() - self.start_time
        if elapsed > self.max_total_runtime:
            print(f"⏰ Total runtime exceeded ({elapsed/3600:.1f}h > {self.max_total_runtime/3600:.1f}h)")
            return True
        return False
    
    def run_scraper_with_monitoring(self) -> bool:
        """Run the scraper with monitoring and automatic restart."""
        print("🚀 Starting CT Job Scraper with Enhanced Restart Functionality")
        print("=" * 70)
        
        # Check if scraper script exists
        if not os.path.exists(self.scraper_script):
            print(f"❌ Error: {self.scraper_script} not found!")
            return False
        
        # Load existing progress
        progress = self.load_progress()
        if progress:
            print(f"🔄 Will resume from previous run")
        else:
            print("🆕 Starting fresh run")
        
        max_attempts = 10
        attempt = 1
        self.is_running = True
        
        while attempt <= max_attempts and self.is_running:
            print(f"\n🔄 Attempt {attempt}/{max_attempts}")
            print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            
            # Check total timeout
            if self.check_timeout():
                print("⏰ Total runtime exceeded, stopping")
                break
            
            try:
                # Run the scraper as a subprocess
                print("🔧 Starting scraper process...")
                self.current_process = subprocess.Popen([
                    sys.executable, self.scraper_script
                ], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
                
                # Monitor the process with timeout
                start_time = time.time()
                output_lines = []
                
                while self.current_process.poll() is None and self.is_running:
                    # Check if single run timeout exceeded
                    if time.time() - start_time > self.max_single_run_time:
                        print(f"⏰ Single run timeout exceeded ({self.max_single_run_time/3600:.1f}h), restarting...")
                        self.current_process.terminate()
                        try:
                            self.current_process.wait(timeout=10)
                        except subprocess.TimeoutExpired:
                            self.current_process.kill()
                        break
                    
                    # Read output line by line
                    try:
                        line = self.current_process.stdout.readline()
                        if line:
                            line = line.strip()
                            output_lines.append(line)
                            print(line)
                            
                            # Check for completion indicators
                            if "🎉 Scraping completed!" in line or "✅ Scraper completed successfully!" in line:
                                print("✅ Scraper completed successfully!")
                                return True
                            
                            # Check for corruption errors
                            if "'dict' object has no attribute" in line:
                                print("❌ Dict corruption detected, will restart...")
                                break
                            
                            # Check for other fatal errors
                            if any(error in line for error in [
                                "❌ Failed to setup browser",
                                "❌ Max restart attempts reached",
                                "❌ Failed to recreate browser context"
                            ]):
                                print(f"❌ Fatal error detected: {line}")
                                return False
                                
                    except Exception as e:
                        print(f"⚠️ Error reading output: {e}")
                        break
                
                # Process completed
                return_code = self.current_process.wait()
                
                if return_code == 0:
                    print("✅ Scraper completed successfully!")
                    return True
                else:
                    print(f"❌ Scraper exited with code {return_code}")
                    
                    # Check output for specific errors
                    output_text = '\n'.join(output_lines[-50:])  # Last 50 lines
                    if "'dict' object has no attribute" in output_text:
                        print("🔄 Dict corruption detected, restarting...")
                    elif "❌ Max restart attempts reached" in output_text:
                        print("❌ Max restart attempts reached in scraper")
                        return False
                    else:
                        print("🔄 Unknown error, restarting...")
                
            except KeyboardInterrupt:
                print("\n🛑 Scraping interrupted by user")
                return False
                
            except Exception as e:
                print(f"❌ Error running scraper: {e}")
            
            # If we get here, the scraper failed
            attempt += 1
            if attempt <= max_attempts and self.is_running:
                wait_time = min(self.restart_delay * attempt, 300)  # Progressive backoff: 1min, 2min, 3min, 5min, 5min...
                print(f"⏳ Waiting {wait_time} seconds before retry...")
                time.sleep(wait_time)
            else:
                print("❌ Max attempts reached. Giving up.")
                return False
        
        return False

def main():
    """Main function to run the scraper with restart management."""
    manager = ScraperRestartManager()
    success = manager.run_scraper_with_monitoring()
    
    if success:
        print("\n🎉 Scraping completed successfully!")
        sys.exit(0)
    else:
        print("\n💥 Scraping failed or was interrupted")
        sys.exit(1)

if __name__ == "__main__":
    main() 