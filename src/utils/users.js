const users = [];

//add a user
const addUser = ({ id, username, room }) => {
    //clean the data
    username = username.trim().toLowerCase();
    room = room.trim().toLowerCase();
    //check if both fields were filled in
    if (!username || !room) {
        return {
            error: 'Username and room are required!'
        }
    }
    //check if username already exists
    const userExists = users.find((user) => {
        return user.room === room && user.username === username
    });
    //validate username
    if (userExists) {
        return {
            error: 'Username is already taken!'
        }
    }
    //add the user if everything pass
    const user = { id, username, room };
    users.push(user);

    return { user };

};

//remove a user
const removeUser = (id) => {
    const index = users.findIndex((user) => user.id === id);
    if (index !== -1) {
        return users.splice(index, 1)[0]; //return an array of all removed users and grab the first one
    }
};
//get a user
const getUser = (id) => {
    return users.find((user) => user.id === id);
};
//get all users in a specific room
const getUsersInRoom = (room) => {
    return users.filter((user) => user.room === room);
};

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}