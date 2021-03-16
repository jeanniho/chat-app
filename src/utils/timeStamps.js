const generateLocationMessage = (username, url) => {
    return {
        username,
        url,
        createdAt: new Date().getTime()
    }
}
const sendMessages = (username, message) => {
    return {
        username,
        message,
        createdAt: new Date().getTime()
    }
}

module.exports = {
    generateLocationMessage,
    sendMessages
}