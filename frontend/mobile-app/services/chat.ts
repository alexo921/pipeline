export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp?: number;
  shiftData?: ShiftData;
};

export type ShiftData = {
  shiftId: string;
  date: string;
  shiftType: string;
  department: string;
  hoursWorked: number;
  patientLoad: number;
  challenges: string[];
  successes: string[];
  notes: string;
  rating: number; // 1-5 scale
  createdAt: number;
};

const JAN_API_URL = 'http://localhost:1337/v1/chat/completions';
const JAN_WEB_URL = 'http://localhost:1420'; // Jan web interface

// Fallback mock API for testing when Jan API is not available
const MOCK_API = false; // Set to false when Jan API is ready

// Local storage for shift data
const SHIFT_STORAGE_KEY = 'pipeline_shift_data';

/**
 * Store shift data locally
 */
export function storeShiftData(shiftData: ShiftData): void {
  try {
    const existingData = getStoredShiftData();
    existingData.push(shiftData);
    localStorage.setItem(SHIFT_STORAGE_KEY, JSON.stringify(existingData));
  } catch (error) {
    console.error('Error storing shift data:', error);
  }
}

/**
 * Get all stored shift data
 */
export function getStoredShiftData(): ShiftData[] {
  try {
    const data = localStorage.getItem(SHIFT_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error retrieving shift data:', error);
    return [];
  }
}

/**
 * Extract shift information from conversation
 */
export function extractShiftData(message: string, conversationHistory: ChatMessage[]): Partial<ShiftData> | null {
  // Simple keyword-based extraction - in a real app, you'd use more sophisticated NLP
  const shiftKeywords = ['shift', 'worked', 'department', 'patient', 'hours', 'challenging', 'successful'];
  const hasShiftContent = shiftKeywords.some(keyword => 
    message.toLowerCase().includes(keyword)
  );
  
  if (!hasShiftContent) return null;
  
  // Extract basic information
  const shiftData: Partial<ShiftData> = {
    shiftId: `shift_${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    createdAt: Date.now(),
  };
  
  // Extract hours worked
  const hoursMatch = message.match(/(\d+)\s*(?:hours?|hrs?)/i);
  if (hoursMatch) {
    shiftData.hoursWorked = parseInt(hoursMatch[1]);
  }
  
  // Extract department
  const departmentMatch = message.match(/(?:in|at|from)\s+([A-Za-z\s]+?)(?:\s|$|,|\.)/i);
  if (departmentMatch) {
    shiftData.department = departmentMatch[1].trim();
  }
  
  // Extract patient load
  const patientMatch = message.match(/(\d+)\s*patients?/i);
  if (patientMatch) {
    shiftData.patientLoad = parseInt(patientMatch[1]);
  }
  
  return shiftData;
}

/**
 * Chat service that connects to Jan AI backend
 */
export async function sendChatMessage(
  prompt: string,
  conversationHistory: ChatMessage[] = []
): Promise<ChatMessage> {
  // Use mock API for testing when Jan API is not available
  if (MOCK_API) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const responses = [
          "Hi! I'm Pip, and I can help you with your healthcare shifts! What specific questions do you have about your recent shift?",
          "Let me assist you with documenting your shift experience. Tell me about your department, hours worked, and how it went?",
          "I'm Pip, here to help with your healthcare shift documentation. Would you like to discuss any challenges or successes from your shift?",
          "I can help you document and reflect on your healthcare shifts. What would you like to share about your recent work?",
          "As Pip, your healthcare shift assistant, I'm ready to help document your shift experience. What do you need assistance with?"
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        resolve({
          id: String(Date.now()),
          role: 'assistant',
          text: randomResponse,
        });
      }, 1000 + Math.random() * 2000); // Simulate API delay
    });
  }

  try {
    const messages = [
        {
          role: 'system',
          content: `You are Pip, a friendly and supportive healthcare workforce assistant. Your primary role is to help healthcare workers document and discuss their shifts. 

When a worker discusses their shift, you should:
1. Ask clarifying questions about their shift experience
2. Document key details like: shift type, department, patient load, challenges, successes, hours worked
3. Help them reflect on their performance and areas for improvement
4. Store important information for future reference
5. Provide supportive feedback and encouragement

Be empathetic, professional, and focused on helping workers process their shift experiences. Ask follow-up questions to get complete information about their shift. Always introduce yourself as Pip and maintain a warm, supportive tone.`
        },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.text
      })),
      {
        role: 'user',
        content: prompt
      }
    ];

    const response = await fetch(JAN_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': 'Bearer your-api-key', // Not needed for local llama-server
      },
          body: JSON.stringify({
            model: '/home/ubuntu/.local/share/Jan/data/llamacpp/models/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf',
            messages,
            temperature: 0.7,
            max_tokens: 500,
            stream: false
          }),
    });

    if (!response.ok) {
      throw new Error(`Jan API error: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.choices[0]?.message?.content || 'I apologize, but I couldn\'t process your request.';
    
    // Extract shift data from the conversation
    const shiftData = extractShiftData(prompt, conversationHistory);
    
    const responseMessage: ChatMessage = {
      id: String(Date.now()),
      role: 'assistant',
      text: responseText,
      timestamp: Date.now(),
    };
    
    // If shift data was extracted, store it and attach to response
    if (shiftData && Object.keys(shiftData).length > 0) {
      const completeShiftData: ShiftData = {
        shiftId: shiftData.shiftId || `shift_${Date.now()}`,
        date: shiftData.date || new Date().toISOString().split('T')[0],
        shiftType: shiftData.shiftType || 'Unknown',
        department: shiftData.department || 'Unknown',
        hoursWorked: shiftData.hoursWorked || 0,
        patientLoad: shiftData.patientLoad || 0,
        challenges: [],
        successes: [],
        notes: prompt,
        rating: 0,
        createdAt: shiftData.createdAt || Date.now(),
      };
      
      storeShiftData(completeShiftData);
      responseMessage.shiftData = completeShiftData;
    }

    return responseMessage;
  } catch (error) {
    console.error('Chat service error:', error);
    // Fallback response
    return {
      id: String(Date.now()),
      role: 'assistant',
      text: 'I\'m having trouble connecting right now. Please try again in a moment.',
    };
  }
}

/**
 * Stream chat messages for real-time responses
 */
export async function* streamChatMessage(
  prompt: string,
  conversationHistory: ChatMessage[] = []
): AsyncGenerator<ChatMessage, void, unknown> {
  try {
    const messages = [
        {
          role: 'system',
          content: `You are Pip, a friendly and supportive healthcare workforce assistant. Your primary role is to help healthcare workers document and discuss their shifts. 

When a worker discusses their shift, you should:
1. Ask clarifying questions about their shift experience
2. Document key details like: shift type, department, patient load, challenges, successes, hours worked
3. Help them reflect on their performance and areas for improvement
4. Store important information for future reference
5. Provide supportive feedback and encouragement

Be empathetic, professional, and focused on helping workers process their shift experiences. Ask follow-up questions to get complete information about their shift. Always introduce yourself as Pip and maintain a warm, supportive tone.`
        },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.text
      })),
      {
        role: 'user',
        content: prompt
      }
    ];

    const response = await fetch(JAN_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': 'Bearer your-api-key', // Not needed for local llama-server
      },
      body: JSON.stringify({
             model: '/home/ubuntu/.local/share/Jan/data/llamacpp/models/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf',
        messages,
        temperature: 0.7,
        max_tokens: 500,
        stream: true
      }),
    });

    if (!response.ok) {
      throw new Error(`Jan API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += new TextDecoder().decode(value);
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content;
            if (content) {
              yield {
                id: String(Date.now()),
                role: 'assistant',
                text: content,
              };
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  } catch (error) {
    console.error('Stream chat error:', error);
    yield {
      id: String(Date.now()),
      role: 'assistant',
      text: 'I\'m having trouble connecting right now. Please try again in a moment.',
    };
  }
}


