const socket = io();

//shared variables
const messageForm = document.querySelector('#sendMessage');
const locationButton = document.querySelector('#sendLocation');
const messages = document.querySelector('#messages');

//templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;
const rightSidebarTemplate = document.querySelector('#rightsidebar-template').innerHTML;

//options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {
    //new message element
    const newMessage = messages.lastElementChild;
    if (!newMessage) { return }
    //height of new message
    const newMessageStyles = getComputedStyle(newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginButtom);
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin;
    //get visible height
    const visibleHeight = messages.offsetHeight;
    //height of messages container
    const containerHeight = messages.scrollHeight;
    //how far have they scrolled
    const scrollOffset = messages.scrollTop + visibleHeight;

    if ((containerHeight - newMessageHeight) <= scrollOffset) {
        messages.scrollTop = messages.scrollHeight;
    }
};

//for when a user joins the chat/channel
socket.on('notificationMessage', (notification) => {
    const html = Mustache.render(rightSidebarTemplate, {
        notification
    });
    document.querySelector('#rightsidebar').innerHTML = html;
});

//for recieving/handling messages
socket.on('receiveMessage', (data) => {
    const html = Mustache.render(messageTemplate, {
        username: data.username,
        message: data.message,
        createdAt: moment(data.createdAt).format('h:mm a')
    });
    messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
}, (error) => {
    if (error) {
        return alert(error);
    }
});

//for sharing location
socket.on('receiveLocation', (data) => {
    const html = Mustache.render(locationTemplate, {
        username: data.username,
        locationUrl: data.url,
        createdAt: moment(data.createdAt).format('h:mm a')
    });
    messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
}, (res) => {
    if (res) {
        return alert(res)
    }
});


//display currently active users
socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    document.querySelector('#sidebar').innerHTML = html;
    autoscroll();
});
//get the message typed by a user
messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    messageForm.setAttribute('disabled', 'disabled');
    const message = document.querySelector('#message');
    socket.emit('sendMessage', message.value, (error) => {
        messageForm.removeAttribute('disabled');
        message.value = '';
        message.focus();
        // Callback to handle acknowledgements
        if (error) {
            return alert(error);
        }
    });
});
//send user location to everyone
locationButton.addEventListener('click', () => {
    //disable the button while getting the coordinates
    locationButton.setAttribute('disabled', 'disabled');
    //check if browser support geolocation
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser!');
    }
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, (res) => {
            //enable the button sever acknowledge that the location was recieved
            locationButton.removeAttribute('disabled');
        });
    });
});

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = '/'; //send em to the root page (log in)
    }
});