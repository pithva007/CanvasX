import { Users, UserCheck, Clock } from 'lucide-react'

export function UserPresence({ users, currentUserId }) {
  const otherUsers = users.filter((u) => u.id !== currentUserId)

  return (
    <div className="fixed right-4 bottom-4 z-40">
      <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-4 w-64 shadow-xl border border-white/30">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-300">
          <Users className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-slate-800">Collaborators</h3>
        </div>

        {/* Users List */}
        <div className="space-y-3">
          {/* Current User */}
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800">You</p>
              <p className="text-xs text-slate-600 font-medium">Connected</p>
            </div>
          </div>

          {/* Other Users */}
          {otherUsers.length > 0 ? (
            otherUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">
                    {user.name || 'User'}
                  </p>
                  <p className="text-xs text-slate-600 font-medium">Connected</p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-yellow-600" />
              <div>
                <p className="text-sm text-slate-700 font-medium">Waiting for second user...</p>
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-4 pt-3 border-t border-slate-300">
          <p className="text-xs text-slate-700 text-center font-semibold">
            {users.length}/2 users in room
          </p>
        </div>
      </div>
    </div>
  )
}
