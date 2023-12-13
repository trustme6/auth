import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, push, set, update } from 'firebase/database';
import { firebaseConfig } from './Firebase';


const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const usersRef = ref(database, 'users');

const UsersTable = () => {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [usersData, setUsersData] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
// eslint-disable-next-line no-unused-vars
const [selectedUser, setSelectedUser] = useState(null);
  const [registrationData, setRegistrationData] = useState({
    name: '',
    email: '',
    password: '',
  });
  
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snapshot = await get(usersRef);
        const data = [];
        snapshot.forEach((childSnapshot) => {
          data.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        setUsersData(data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleCheckboxChange = (userId) => {
    const isSelected = selectedUsers.includes(userId);
    if (isSelected) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };
 
  const handleSelectAll = () => {
    if (selectedUsers.length === usersData.length) {
      setSelectedUsers([]);
    } else {
      const allUserIds = usersData.map((user) => user.id);
      setSelectedUsers(allUserIds);
    }
  };

  const handleBlock = async () => {
    try {
      const updatedUsers = usersData.map((user) =>
        selectedUsers.includes(user.id) ? { ...user, status: 'Blocked' } : user
      );
      await set(ref(database, 'users'), updatedUsers);
      setUsersData(updatedUsers);
      setSelectedUsers([]);
      handleLogout();
    } catch (error) {
      console.error('Error blocking users:', error.message);
    }
  };

  const handleUnblock = async () => {
    try {
      const updatedUsers = usersData.map((user) =>
        selectedUsers.includes(user.id) ? { ...user, status: 'Active' } : user
      );
      await set(ref(database, 'users'), updatedUsers);
      setUsersData(updatedUsers);
      setSelectedUsers([]);
    } catch (error) {
      console.error('Error unblocking users:', error.message);
    }
  };

  const handleDelete = async () => {
    try {
      const db = getDatabase();
      const deleteUpdates = {};
      for (const userId of selectedUsers) {
        deleteUpdates[`/users/${userId}`] = null;
      }
      await update(ref(db), deleteUpdates);
      const updatedUsers = usersData.filter((user) => !selectedUsers.includes(user.id));
      setUsersData(updatedUsers);
      setSelectedUsers([]);
      if (selectedUsers.includes(loggedInUser.id)) {
        handleLogout();
        return;
      }
    } catch (error) {
      console.error('Error deleting users:', error.message);
    }
  };

  const handleRegistrationChange = (e) => {
    const { name, value } = e.target;
    setRegistrationData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const newUserRef = push(usersRef);
    const newUser = {
      id: newUserRef.key,
      registrationDate: new Date().toISOString().slice(0, 10),
      lastLogin: '',
      status: 'Active',
      ...registrationData,
    };
    try {
      await set(newUserRef, newUser);
      setUsersData((prevUsers) => [...prevUsers, newUser]);
      setRegistrationData({
        name: '',
        email: '',
        password: '',
      });
    } catch (error) {
      console.error('Error registering user:', error.message);
    }
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const user = usersData.find(
      (u) => u.email === loginData.email && u.password === loginData.password
    );
  
    if (user) {
      if (user.status === 'Blocked') {
        console.log('User is blocked. Cannot log in.');
      } else {
        setLoggedInUser({ ...user, lastLogin: new Date().toISOString().slice(0, 10) });
        setSelectedUser({ ...user, lastLogin: new Date().toISOString().slice(0, 10) });
        console.log('Logged in as:', user.name);
      }
    } else {
      console.log('User not found');
    }
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setSelectedUsers([]);
    console.log('Logged out');
  };

  return (
    <div>
     {loggedInUser ? (
  <div>
    <div className="welcome-message">
      <h3>Hello, {loggedInUser.name}!</h3>
    </div>
          <button className="btn btn-secondary" onClick={handleLogout}>
            Logout
          </button>
          <div className="toolbar">
            <button className="btn btn-danger" onClick={handleBlock}>
              Block
            </button>
            <button className="btn btn-success" onClick={handleUnblock}>
              Unblock
            </button>
            <button className="btn btn-warning" onClick={handleDelete}>
              Delete
            </button>
          </div>
          <table className="table">
            <thead>
              <tr>
              <th scope="col">
  <input type="checkbox" onChange={handleSelectAll} />
</th>
                <th scope="col">ID</th>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Registration Date</th>
                <th scope="col">Last Login</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {usersData.map((user) => (
                <tr key={user.id}>
                  <td>
                    <input
                      type="checkbox"
                      onChange={() => handleCheckboxChange(user.id)}
                      checked={selectedUsers.includes(user.id)}
                    />
                  </td>
                  <td>{user.id}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.registrationDate}</td>
                  <td>{loggedInUser.lastLogin}</td>
                  <td>{user.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div>
          <div className="login-form">
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
              <label>
                Email:
                <input type="email" name="email" value={loginData.email} onChange={handleLoginChange} />
              </label>
              <label>
                Password:
                <input type="password" name="password" value={loginData.password} onChange={handleLoginChange} />
              </label>
              <button type="submit" className="btn btn-primary">
                Login
              </button>
            </form>
          </div>
          <div className="registration-form">
            <h2>Register</h2>
            <form onSubmit={handleRegister}>
              <label>
                Name:
                <input type="text" name="name" value={registrationData.name} onChange={handleRegistrationChange} />
              </label>
              <label>
                Email:
                <input type="email" name="email" value={registrationData.email} onChange={handleRegistrationChange} />
              </label>
              <label>
                Password:
                <input type="password" name="password" value={registrationData.password} onChange={handleRegistrationChange} />
              </label>
              <button type="submit" className="btn btn-primary">
                Register
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersTable;