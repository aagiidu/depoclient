import React, {useEffect, useState} from 'react'
import io from 'socket.io-client'
import './App.css'
import axios from 'axios'

export default function App() {

  const SOCKET_URI = 'http://157.245.151.65:5000';

  const [successList, setSuccessList] = useState([]);
  const [failedList, setFailedList] = useState([]);
  const [searchList, setSearchList] = useState([]);
  const [socket, setSocket] = useState(null)
  const [loggedIn, setLoggedId] = useState(false)
  const [searching, setSearching] = useState(false)
  const [username, setUsername] = useState('')
  const room = "Javascript";
  let search = false;
  // let setup = false;
  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if(loggedIn){
      const socket = io.connect(SOCKET_URI);
      setSocket(socket);
      setupSocketListeners(socket);
    }
  }, [loggedIn]);

  const checkUser = async () => {
    const storedUser = localStorage.getItem('username');
    if(storedUser) {
      setLoggedId(true);
      setUsername(storedUser);
      setTimeout(() => {
        refresList();
      }, 1000)
    }
  }

  const setupSocketListeners = (socket) => {
    console.log('setupSocketListeners')
    socket &&
      socket.on('connect', () => {
        console.log('SOCKET on connect', socket)
        socket.emit('joinRoom', { username, room });
      });
    socket && socket.on('successList', (data) => { 
      console.log('successList', search, data);
      if(search === false){
        setSuccessList(data);
      }
    });
    socket && socket.on('failedList', (data) => { 
      console.log('failedList', search, data);
      if(search === false){
        setFailedList(data);
      }
    });
  };

  const deleteMsg = async (id) => {
    const c = window.confirm('Устгахдаа итгэлтэй байна уу?');
    if(c){
      const res = await axios.post(`http://157.245.151.65:5000/api/delete`, {id});
      if(res.data.msg === 'success'){
        const list = failedList.filter(m => m._id !== id)
        console.log('after delete', list)
        setFailedList(list)
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('username')
    localStorage.removeItem('loginTime')
    window.location.reload()
  }

  const searchMsg = async (e) => {
    e.preventDefault();
    const txt = e.target.searchvalue ? e.target.searchvalue.value : '';
    if(!txt || txt.length < 2) return false;
    const res = await axios.post(`http://157.245.151.65:5000/api/search`, {username: txt});
    if(res.data.msg === 'success'){
      setSearchList(res.data.searchList)
    }
  }

  const refresList = async () => {
    await axios.get(`http://157.245.151.65:5000/api/refresh`);
  }

  const clearSearch = () => {
    setSearchList([]);
    closeSearch();
  }

  const closeSearch = () => {
    setSearching(false)
  }

  const openSearch = () => {
    setSearching(true)
  }

  const ListPage = () => {
    return (
      <div className='container'>
        <div className='row mb-1'>
          <div className='col-sm-6'>
            <button type="button" className="btn btn-primary btn-sm px-5" onClick={openSearch}>
              Хайх
            </button>
          </div>
          <div className='col-sm-6'>
            <p>
              <button type='button' className='btn btn-success btn-sm float-right px-5' onClick={logout}>Logout</button>
            </p>
          </div>
        </div>
        <div className='row'>
          <div className='col-sm-6 thin-scroll'>
            <div className='msgcol'>
              {
                failedList.map(m => <MessageTile msg={m} key={m._id} onDelete={deleteMsg} />)
              }
            </div>
          </div>
          <div className='col-sm-6 thin-scroll'>
            <div className='msgcol'>
              {
                successList.map(m => <MessageTile msg={m} key={m._id} onDelete={deleteMsg} />)
              }
            </div>
          </div>
        </div>
      </div>
    )
  }

  const SearchPage = () => {
    return (
      <div className='container' style={{maxWidth: '500px', margin: 'auto'}}>
        <form onSubmit={searchMsg}>
          <div className="input-group">
            <div className="input-group-prepend">
              <button className="btn btn-secondary" type="button" onClick={clearSearch}>Буцах</button>
            </div>
            <input type="text" className="form-control" name='searchvalue' placeholder="Хайлт..." />
            <div className="input-group-append">
              <button className="btn btn-success" type="submit">Хайх</button>
            </div>
          </div>
        </form>
        <div className='thin-scroll'>
          <div className='msgcol msgcol2'>
            {
              searchList.map(m => <MessageTile msg={m} key={m._id} onDelete={deleteMsg} />)
            }
          </div>
        </div>
      </div>
    )
  }

  const onLogin = async (e) => {
    e.preventDefault();
    const loginuser = e.target.username.value;
    const password = e.target.password.value;
    if((loginuser === 'autodepo' || loginuser === 'autodepo2') && password === 'qwerty123'){
      const d = Date();
      localStorage.setItem('username', loginuser);
      localStorage.setItem('loginTime', d);
      setLoggedId(true);
      setUsername(loginuser);
      setTimeout(() => {
        refresList();
      }, 1000)
      
    }else{
      alert('Login failed!')
    }
  }

  const LoginPage = () => {
    return (
      <div className='container login-form'>
        <form onSubmit={onLogin}>
          <input name='username' className='form-control form-control-sm mb-2' placeholder='Нэвтрэх нэр'/>
          <input name='password' type='password' className='form-control form-control-sm mb-2' placeholder='Нууц үг'/>
          <button type='submit' className='btn btn-primary btn-sm w-100' >Login</button>
        </form>
      </div>
    )
  }
  return (
    loggedIn ? searching ? <SearchPage /> : <ListPage /> : <LoginPage />
  )
}

function MessageTile(props){
  const {msg, onDelete} = props;
  const date = dateConvert(msg.timestamp)
  return (
    <div className={'alert p-2 mb-1 alert-' + (msg.status === 1 ? 'danger' : 'success')}>
      {msg.status === 1 && <button type="button" className="close" onClick={() => onDelete(msg._id)}>&times;</button>}
      <h6 className='title'>{date}</h6>
      <p>{msg.body}</p>
      <p>Хэрэглэгч: <span className='font-weight-bold'>{msg.username}</span> 
        <span className='float-right'>Дүн: <span className='font-weight-bold'>₮{numberFormat(msg.amount)}</span></span> 
      </p>
      {msg.errorText &&
        <p className='bg-warning px-2 py-1'> <span>Алдаа: {msg.errorText}</span></p>
      }
    </div>
  );
}

const dateConvert = (mills) => {
  const date = new Date(mills)
	let seconds = date.getSeconds()
	if (seconds < 10) seconds = '0' + seconds
	let minutes = date.getMinutes()
	if (minutes < 10) minutes = '0' + minutes
	let hours = date.getHours()
	if (hours < 10) hours = '0' + hours
	const years = date.getFullYear()
	let months = date.getMonth() + 1
	if (months < 10) months = '0' + months
	let days = date.getDate()
	if (days < 10) days = '0' + days
	return `${years}-${months}-${days} ${hours}:${minutes}:${seconds}`
}

const numberFormat = (x) => {
  return x ? x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : '0'
}