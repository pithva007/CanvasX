import { Users, UserCheck, Clock } from 'lucide-react'

export function UserPresence({ users, currentUserId }) {
  const otherUsers = users.filter((u) => u.id !== currentUserId)

  return (
    <div className="fixed right-4 bottom-4 z-40">
      <div className="glass rounded-2xl p-4 w-64">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-600">
          <Users className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-white">Collaborators</h3>
        </div>

        {/* Users List */}
        <div className="space-y-3">
          {/* Current User */}
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-white">You</p>
              <p className="text-xs text-gray-400">Connected</p>
            </div>
          </div>

          {/* Other Users */}
          {otherUsers.length > 0 ? (
            otherUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">
                    {user.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-400">Connected</p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center gap-3 opacity-50">
              <Clock className="w-4 h-4 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-300">Waiting for second user...</p>
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-4 pt-3 border-t border-gray-600">
          <p className="text-xs text-gray-400 text-center">
            {users.length}/2 users in room
          </p>
        </div>
      </div>
    </div>
  )
}
