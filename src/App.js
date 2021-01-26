import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import Preloader from './preloader/Preloader';

import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';
import 'firebase/storage';

import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';


//initilalize firebase
if (!firebase.apps.length) {
  firebase.initializeApp({
    apiKey: "AIzaSyCTFiYhbsWddczgofjfgEgP-i7viAOUgxQ",
    authDomain: "simplechat-5073a.firebaseapp.com",
    databaseURL: "https://simplechat-5073a-default-rtdb.firebaseio.com",
    projectId: "simplechat-5073a",
    storageBucket: "simplechat-5073a.appspot.com",
    messagingSenderId: "1032940693503",
    appId: "1:1032940693503:web:35e1f6d9fecbd8ab12e9ca"
  });
} else {
  firebase.app(); // if already initialized, use that one
}


//creat auth and base
const auth = firebase.auth();
const firestore = firebase.firestore();

//creat storage
const storageRef = firebase.storage().ref();
const img = storageRef.child('img');

function Nickname(props) {
  const [nickname, setNickname] = useState('');
  const nickRef = firestore.collection('users');
  const query = nickRef.orderBy('nickname');
  const [nicknameErr, setNicknameError] = useState(false);

  const [nicknames] = useCollectionData(query, { idField: 'id' });

  const checkNickName = (e) => {
    setNickname(e.target.value);
    setNicknameError(false)
    if (nicknames.some(u => u.nickname === e.target.value)) setNicknameError(true);
  }
  const sendNickname = async (e,props) => {
    e.preventDefault();
    const { uid } = auth.currentUser;
    if (!nicknameErr) await nickRef.add({
      nickname,
      uid
    });
    props.user.updateProfile({
      displayName: nickname,
    });
    props.setUpdate(false);
  }

  return (
    <div className="fade">
      <form className='nickForm' onSubmit={(e)=> sendNickname(e,props) }>
        Please, input your nickname
      <div className="nickname">
          <input type="text" placeholder="nickname" value={nickname} onChange={checkNickName} />
        </div>
        <p className="errNick">{nicknameErr ? 'Name is already taken' : null}</p>
        <button className="submit" disabled={nicknameErr}>Submit</button>
      </form>
    </div>
  )
}

function SignIn(props) {

  let [signInWithEmail, setSignInWithEmail] = useState(false);

  const SignInPopUp = (props) => {
    let [showPass, setShowPass] = useState(false);
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [errorLog, setErrorLog] = useState('');


    const toggleShow = () => {
      showPass = !showPass;
      setShowPass(showPass);
    }

    const showError = (error) => {
      setErrorLog(error);
    }
    const sendForm = (e) => {
      e.preventDefault();

      firebase.auth().createUserWithEmailAndPassword(login, password).catch({
        function(error) {
          let errorCode = error.code;
          let errorMessage = error.message;
          if (errorCode === 'auth/weak-password') {
            showError('The password is too weak')
          } else {
            showError(errorMessage)
          }
        }
      })

      firebase.auth().signInWithEmailAndPassword(login, password)
        .catch((error) => {
          let errorMessage = error.message;
          showError(errorMessage)
        });
    }

    return (
      <div className="fade">
        <div className="close" onClick={props.SignInWithEmailPop}>✖</div>
        <form onSubmit={sendForm} className="formLog">
          <input className="login" type="text" placeholder="E-mail" value={login} onChange={(e) => setLogin(e.target.value)} />
          <div className="passRow">
            <input type={!showPass ? "password" : "text"} placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button onClick={toggleShow}>{!showPass ? '👁️' : ' ➖ '}</button>
          </div>
          <div className="error">
            <p>{errorLog}</p>
            <button className="submit">Submit</button>
          </div>
        </form>
      </div>
    )
  }

  //SignIn with Email
  const SignInWithEmailPop = () => {
    signInWithEmail = !signInWithEmail;
    setSignInWithEmail(signInWithEmail);
  }

  //SignIn with Google
  const SignInWithGoogle = (props) => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).then(function (result) {
      let user = result.user.displayName;
    });
  }
  //SignIn like anonim
  const SignInLikeAnonim = () => {
    firebase.auth().signInAnonymously()
  }

  return (
    <section className='signInRow'>
      {signInWithEmail ? <SignInPopUp SignInWithEmailPop={SignInWithEmailPop} /> : null}
      <button className='email' onClick={SignInWithEmailPop}>Sign up with e-mail</button>
      <button className='email' onClick={SignInWithEmailPop}>Sign in with e-mail</button>
      <button className='google' onClick={SignInWithGoogle}>Sign in with Google</button>
      <button className='anon' onClick={SignInLikeAnonim}>Sign like anonim(with restriction)</button>
    </section>
  )
}

function SignOut(props) {
  return auth.currentUser && (
    <button className="signOut" onClick={() => {
      auth.signOut()
    }}>Sign Out</button>
  )
}

function ChatMessage(props) {
  const { text, uid, photoURL, name = 'Anonim' } = props.message;
  const messageStyle = uid === auth.currentUser.uid ? 'sent' : 'received';
  return (
    <div className={`message ${messageStyle}`}>
      <img src={photoURL} />
      <div className="msgRow">
        <p className="name">{name}</p>
        <p className="msg">{text}</p>
      </div>
    </div>)
}



function ChatRoom(props) {

  const scroll = useRef();
  const [unknown, setUnknown] = useState('');

  img.child('user.png').getDownloadURL().then(url => {
    setUnknown(url)
  });

  const messageRef = firestore.collection('messages');
  const query = messageRef.orderBy('createdAt').limit(30);

  const [messages] = useCollectionData(query, { idField: 'id' });
  const [formValue, setFormValue] = useState(``);
  const [update, setUpdate] = useState(true);
 
  const sendMessage = async (e) => {
    e.preventDefault();
    const name = firebase.auth().currentUser.displayName;
    const { uid, photoURL } = auth.currentUser;
    if (formValue !== '') await messageRef.add({
      text: formValue,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid,
      photoURL: photoURL !== null ? photoURL : unknown,
      name
    })

    setFormValue('');
    scroll.current.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <> 
    {update ? <Nickname setUpdate={setUpdate} user={props.user} /> : null}
      <section>
        <div className='messageSection'>
          {messages === undefined ? <Preloader /> : messages && messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
          <div ref={scroll}></div>
        </div>

        <form onSubmit={sendMessage} className='form'>
          <textarea value={formValue} onChange={(e) => setFormValue(e.target.value)} />
          <button type='submit'>Send</button>
        </form>


      </section>
    </>
  )
}


//main App
function App() {
  const [user, loading, error] = useAuthState(auth);
  return (
    <div className="App">
      <header>
        <div className="title">
          <p>Simple Chat</p>
        </div>
        {user ? <SignOut /> : null}
      </header>
      <div className="container">
        <main>
          {loading ? <Preloader /> : user === null ? <SignIn /> : <ChatRoom user={user} />}
        </main>
      </div>
    </div>
  );
}

export default App;
