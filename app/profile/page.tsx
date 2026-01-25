//import React from 'react'

// const ProfilePage=() => {
//     return (
//         <div>ProfilePage</div>
//     )
// }
    
// export default ProfilePage

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function ProfilePage() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      
      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><span className="font-medium">Name:</span> John Doe</p>
          <p><span className="font-medium">Email:</span> johndoe@example.com</p>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>Get reminders before products expire.</p>
          <Button>Update Preferences</Button>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline">Change Password</Button>
          <Button variant="destructive">Logout</Button>
        </CardContent>
      </Card>

    </div>
  )
}
