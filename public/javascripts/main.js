// Sockets
const socket = io();
let name = 'Anon: ';

socket.on('chatMsg', function(chatPayload){
    store.dispatch(addText(chatPayload.payload))
});

socket.on('newImg', function(data){
    updateSkyMaterial(data.newImg);
})

// Globals for passing between React and Three
var ENTITIES = []

// Redux setup
const {createStore} = Redux;
const {connect, Provider} = ReactRedux;

// === Constant ===
const SET_TEXT = Symbol('Set Text Output');
const ADD_TEXT = Symbol('Add Text Output');
const SET_OUTGOING_TEXT = Symbol('Set outgoing text');
const SEND_MESSAGE = Symbol('Send message');
const SET_LOGGED_IN = Symbol('Set logged in status to true');

// === Actions ===
const setText = function(text) {
    return {
      type: SET_TEXT,
      payload: text
    };
};

const addText = function(text) {
    return {
      type: ADD_TEXT,
      payload: text
    };
};

const setOutgoing = function(text) {
    return {
      type: SET_OUTGOING_TEXT,
      payload: text
    };
};

const sendMessage = function(message) {
    return {
        type: SEND_MESSAGE,
        payload: name + message
    }
}

const setLoginStatus = function(loginStatus) {
    return {
        type: SET_LOGGED_IN,
        payload: loginStatus
    }
}

const initState = {
    text: 'Hello virtual world.',
    incoming: '',
    outgoing: '',
    loggedIn: false
};

const rootReducer = function(state = initState, action) {
    switch (action.type) {
        case SET_TEXT:
            return {...state, text: action.payload};
        case ADD_TEXT:
            let newText = `${state.text} <br /> ${action.payload}`;
            return {...state, text: newText};
        case SET_OUTGOING_TEXT:
            return {...state, outgoing: action.payload};
        case SEND_MESSAGE:
            socket.emit('chatMsg', {id: socket.id, payload: name + state.outgoing});
            return {...state, outgoing: ''};
        case SET_LOGGED_IN:
            return {...state, loggedIn: action.payload};
        default:
            return state;
    }
};

const store = createStore(rootReducer);

class ThreePanel extends React.Component {
    render() {
        return(
            <div id='scene' style={{
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100%',
                height: '100vh',
                zIndex: '-1'
            }}></div>
        )
    }
}

class UserInventory extends React.Component {
    render() {
        return(
            <div>
                yo
            </div>
        )
    }
}

class UploadPanel extends React.Component {
    constructor(){
        super();
        this.handleUpload = this.handleUpload.bind(this);
    }

    handleUpload(event) {
        event.preventDefault();
        let uploadButtonText = document.getElementById('upload-btn-text');
        uploadButtonText.textContent = 'Uploading...';
        let fileSelector = document.getElementById('fileUpload');
        let file = fileSelector.files[0];
        console.log(file);
        let data = new FormData();
        data.append('photo', file);
        console.log(data);
        let xhr = new XMLHttpRequest();
        xhr.open('POST', '/fileUpload', true);
        xhr.onload = function(response){
            console.log('done', response);
        }
        xhr.send(data);
        return false;
    }
    render() {
        return(
            <div className='container'>
            <h2 style={{textAlign:'center'}}>Share a 360 scene!</h2>
            <hr/>
                <form className='ajax-form' onSubmit={this.handleUpload}>
                    <div className='form-group'>
                        <input type='file' name='photo' id='fileUpload' className='btn ajax-button btn-lg btn-block' />
                        <button className='btn ajax-button btn-dark btn-lg btn-block' type='submit'>
                            <span id='upload-btn-text' className='button-text'>Upload</span>
                        </button>
                    </div>
                </form>
            </div>
        )
    }
}
class _LoginForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            registration: false,
            modeSwitched: false
        }
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleRegister = this.handleRegister.bind(this);
    }

    handleSubmit(event) {
        event.preventDefault();
        let data = new FormData(event.target);
        let url = '/users/login';
        if (this.state.registration === true) {
            url = '/users/create';
        };
        fetch(url, {
            body: data,
            method: 'POST',
            credentials: 'same-origin'
        })
            .then(res => res.json())
            .then(data => {
                if (data.success === true) {
                    name = data.name + ': ';
                    this.props.setLoginStatus(true);
                } else {
                    console.log('failed to login');
                }
            });
    }

    handleRegister(event){
        let currState = {...this.state};
        if (currState.registration === false) {
            currState.registration = true;
            this.setState(currState);
        }
    }
    render() {
        return(
            <div id='login'>
                <div className='container'>
                    <h2 className='text-center'>{this.state.registration === false && 'Sign in to your account'}{this.state.registration === true && 'Register an account'}</h2>
                    <hr/>
                    <div id='login-form-container'>
                        <form id='loginForm' className='ajax-form' onSubmit={this.handleSubmit} method='POST'>
                            <div className='form-group'>
                                <input type='email' name='email' id='loginEmail' className='form-control' placeholder='Email Address' autoFocus />
                            </div>
                            {this.state.registration === true && <div className='form-group'>
                                <input type='username' name='username' id='loginUserName' className='form-control' placeholder='User Name' />
                            </div>}
                            <div className='form-group'>
                                <input type='password' name='password' id='loginPassword' className='form-control' placeholder='Password' />
                            </div>
                            {this.state.registration === true && <div className='form-group'>
                                <input type='password' name='passwordConf' id='loginPasswordConf' className='form-control' placeholder='Confirm password' />
                            </div>}
                            {this.state.registration === false && <div className='form-group'>
                                <input type='checkbox' id='remember' name='rememberMe' />
                                <label htmlFor='remember'>Remember Me</label>
                            </div>}
                            <div className='form-group'>
                                <button className='btn ajax-button btn-dark btn-lg btn-block' type='submit'>
                                    <span className='button-text'>Submit</span>
                                </button>
                                {this.state.registration === false && <button className='btn ajax-button btn-dark btn-lg btn-block' onClick={this.handleRegister}>
                                    <span className='button-text'>Register</span>
                                </button>}
                            </div>
                            <p className='text-center'>
                                <a href='#'>Forgot your password?</a>
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        )
    }
}

class _ChatPanel extends React.Component {
    appendText(text) {
        this.props.addText(text);
    }
 
    getText(){
        let text = this.props.text;
        return {__html: text} 
    }

    toggleFlyout(event) {
        let targetId = event.target.getAttribute('id');
        if (targetId === 'chatMessage' || targetId === 'chat-form' || targetId === 'chat-btn' || targetId === 'chat-btn-content' ) {return};
        let panel = document.querySelector('.chat-panel');
        if (panel.style.bottom == '-420px') {
            panel.style.bottom = '0';
        } else {
            panel.style.bottom = '-420px';
        };
    }

    render() {
        return(
            <div className='chat-panel' style={{
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                color: 'black',
                width: '300px',
                height: '450px',
                position: 'fixed',
                bottom: '-420px',
                right: '300px',
                borderRadius: '8px',
                transition: 'all 0.5s',
            }} onClick={this.toggleFlyout} >
                <div className='chat-container' style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                }}>
                    <div className='chat-content' 
                        dangerouslySetInnerHTML={this.getText()}
                        style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            borderTopLeftRadius: '8px',
                            borderTopRightRadius: '8px',
                            color: 'black',
                            position: 'absolute',
                            top: '0',
                            left: '0',
                            width: '100%',
                            height: '420px',
                            overflowY: 'auto',
                            zIndex: '99',
                            padding: '0.75em'
                        }}
                    />
                    <ChatInput />
                </div>
            </div>
        )
    }
}

class _ChatInput extends React.Component {
    constructor(props) {
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event) {
        this.props.setOutgoing(event.target.value);
    }
    handleSubmit(event) {
        event.preventDefault();
        let message = document.getElementById('chatMessage').value;
        console.log(name + message);
        this.props.sendMessage(name + message);
    }

    render() {
        return(
            <div className='chat-input' style={{
                position: 'absolute',
                bottom:'0',
                left:'0',
                borderBottomLeftRadius: '8px',
                borderBottomRightRadius: '8px',
                width: '100%'
            }}>
                <form id='chat-form' onSubmit={this.handleSubmit}>
                    <input type='text' onChange={this.handleChange} value={this.props.outgoing} name='chatMessage' id='chatMessage' style={{
                        width: '80%', 
                        height:'1.5em',
                        display: 'inline-block',
                        marginLeft: '10px',
                        }}/>
                    <button className='btn btn-sm btn-primary' type='submit' id='chat-btn' style={{marginLeft:'16px'}}>
                        <span className='button-text' id='chat-btn-content'>+</span>
                    </button>
                </form>
            </div>
        )
    }
}

class _SidePanel extends React.Component {

    componentDidMount() {
        this.props.setLoginStatus(loggedIn);
    }

    render() {
        return(
            <div className='side-panel' style={{
                position: 'fixed',
                top: '0',
                right: '0',
                width: '300px',
                height: '100%',
                backgroundColor: 'white',
                color: 'black',
                padding: '0.75em'
            }}>
                {this.props.loggedIn === false && <LoginForm />}
                {this.props.loggedIn === true && <UploadPanel />}
            </div>
        )
    }
}

class App extends React.Component {
    
    render() {
        return(
            <div style={{
                color: 'white',
                zIndex: '0'
            }}>
                <ChatPanel />
                <SidePanel />
                <ThreePanel />
            </div>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        text: state.text,
        incoming: state.incoming,
        outgoing: state.outgoing,
        loggedIn: state.loggedIn
    }
}

const mapDispatchToProps = function(dispatch) {
    return {
        setText: function(text) {
            dispatch(setText(text))
        },
        addText: function(text) {
            dispatch(addText(text))
        },
        sendMessage: function(message) {
            dispatch(sendMessage(message))
        },
        setOutgoing: function(text) {
            dispatch(setOutgoing(text))
        },
        setLoginStatus: function(loginStatus) {
            dispatch(setLoginStatus(loginStatus))
        }
    };
};
const LoginForm = connect(mapStateToProps, mapDispatchToProps)(_LoginForm);
const SidePanel = connect(mapStateToProps, mapDispatchToProps)(_SidePanel);
const ChatInput = connect(mapStateToProps, mapDispatchToProps)(_ChatInput);
const ChatPanel = connect(mapStateToProps, mapDispatchToProps)(_ChatPanel);
// const App = connect(mapStateToProps, mapDispatchToProps)(_App);

ReactDOM.render(
    <Provider store={store}>
        <App/>
    </Provider>,
    document.getElementById('root')
)

CONTAINER = document.getElementById('scene');

init3D();
animate3D();


