import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";

export default function UserDashboard() {
  const [user, setUser] = useState(null);
  const auth = getAuth();

  useEffect(() => {
    // Get currently logged-in user
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser({ name: currentUser.email }); // Firebase Auth has email, uid, etc.
    }
  }, [auth]);

  if (!user) {
    return <p>Loading...</p>; // Show while user info loads
  }

  return (
    <div>
      <h1>User Dashboard</h1>
      <p>Welcome to your dashboard, {user.name}!</p> <br/>
      <p>Here you can view and manage your reports.</p>
    </div>
  );
}