import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200">
        <div className="p-4">
          <h1 className="text-xl font-bold text-gray-800">Pipeline</h1>
        </div>
        <nav className="mt-4">
          <Link href="/dashboard" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
            <span className="ml-2">Dashboard</span>
          </Link>
          <Link href="/projects" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
            <span className="ml-2">Projects</span>
          </Link>
          <Link href="/analytics" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
            <span className="ml-2">Analytics</span>
          </Link>
          <Link href="/settings" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
            <span className="ml-2">Settings</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Welcome to Pipeline</h2>
          <p className="text-gray-600">Manage your projects and track progress</p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Stats Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800">Active Projects</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">12</p>
          </div>

          {/* Stats Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800">Completed Tasks</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">48</p>
          </div>

          {/* Stats Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800">Team Members</h3>
            <p className="text-3xl font-bold text-purple-600 mt-2">8</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h3>
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <p className="text-gray-600">Project Alpha updated</p>
              <p className="text-sm text-gray-500">2 hours ago</p>
            </div>
            <div className="p-4 border-b border-gray-200">
              <p className="text-gray-600">New task assigned</p>
              <p className="text-sm text-gray-500">4 hours ago</p>
            </div>
            <div className="p-4">
              <p className="text-gray-600">Team meeting scheduled</p>
              <p className="text-sm text-gray-500">1 day ago</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
