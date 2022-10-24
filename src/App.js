import React, {useEffect, useState} from 'react'
import io from 'socket.io-client'
import './App.css'
import axios from 'axios'

export default function App() {

  const SOCKET_URI = 'http://localhost:5000'; // 'http://157.245.151.65:5000';

  const [successList, setSuccessList] = useState([]);
  const [failedList, setFailedList] = useState([]);
  const [searchList, setSearchList] = useState([]);
  const [socket, setSocket] = useState(null)
  const [loggedIn, setLoggedId] = useState(false)
  const [searching, setSearching] = useState(false)
  const [username, setUsername] = useState('')
  const [activeList, setActiveList] = useState(1)
  const room = "Javascript";
  const serverUrl = 'http://localhost:5000'; // 'http://157.245.151.65:5000';
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
      const res = await axios.post(`${serverUrl}/api/delete`, {id});
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
    const res = await axios.post(`${serverUrl}/api/search`, {username: txt});
    if(res.data.msg === 'success'){
      setSearchList(res.data.searchList)
    }
  }

  const getByTime = async (h) => {
    const range = h * 3600000
    setSearchList([])
    const now = new Date()
    const end = now.getTime()
    const start = end - range
    const res = await axios.get(`${serverUrl}/api/report/${start}/${end}`);
    if(res.data.msg === 'success'){
      setSearchList(res.data.messages)
    }
  }

  const refresList = async () => {
    await axios.get(`${serverUrl}/api/refresh`);
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

  const showFailed = () => {
    setActiveList(1)
  }

  const showSuccess = () => {
    setActiveList(2)
  }

  const deleteAll = async () => {
    const c = window.confirm('Бүгдийг нь устгахдаа итгэлтэй байна уу?');
    if(c){
      const res = await axios.post(`${serverUrl}/api/delete/success`, {token: '4523bbb27f114137a4169da1c5e7fda0'});
    }
  }

  const ListPage = () => {
    return (
      <div className='container'>
        <div className='mb-1'>
          
            <div className='row d-flex justify-content-between top-bar'>
              <button type="button" className="btn btn-primary btn-sm" onClick={openSearch}>Хайх</button>
              <button type='button' className='btn btn-success btn-sm' onClick={refresList}>Refresh</button>
              <button type='button' className='btn btn-danger btn-sm float-right' onClick={deleteAll}>DeleteAll</button>
              <button type='button' className='btn btn-danger btn-sm float-right' onClick={logout}>Logout</button>
            </div>

        </div>
        <div className='row web'>
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
        <div className='row phone'>
          <div className='col-sm-12 thin-scroll'>
            <div className='msgcol'>
              {
                activeList === 1 && failedList.map(m => <MessageTile msg={m} key={m._id} onDelete={deleteMsg} />)
              }
              {
                activeList === 2 && successList.map(m => <MessageTile msg={m} key={m._id} onDelete={deleteMsg} />)
              }
            </div>
          </div>
          <div className='col-sm-12'>
            <div className='row bottom-bar d-flex justify-content-between'>
              <button type='button' className='btn btn-danger btn-sm' onClick={showFailed}>Алдаатай</button>
              <button type='button' className='btn btn-success btn-sm' onClick={showSuccess}>Амжилттай</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const SearchPage = () => {
    return (
      <div className='container'>
        <div className='row'>
          <div className='col-sm-5'>
            <form onSubmit={searchMsg}>
              <div className="input-group">
                <div className="input-group-prepend">
                  <button className="btn btn-secondary" type="button" onClick={clearSearch}>Буцах</button>
                </div>
                <input type="text" className="form-control" name='searchvalue' placeholder="Хэрэглэгчийн нэр..." />
                <div className="input-group-append">
                  <button className="btn btn-success" type="submit">Нэрээр хайх</button>
                </div>
              </div>
            </form>
          </div>
          <div className='col-sm-7'>
            <button className="btn btn-success" type="button" onClick={() => getByTime(1)}>1 цаг</button>
            <button className="btn btn-success" type="button" onClick={() => getByTime(2)}>2 цаг</button>  
            <button className="btn btn-success" type="button" onClick={() => getByTime(3)}>3 цаг</button>  
            <button className="btn btn-success" type="button" onClick={() => getByTime(4)}>4 цаг</button>  
            <button className="btn btn-success" type="button" onClick={() => getByTime(5)}>5 цаг</button>  
          </div>
        </div>
        
        <div className='thin-scroll' style={{maxWidth: '500px', margin: 'auto'}}>
          <div className='msgcol msgcol2'>
            {
              searchList && searchList.map(m => <MessageTile msg={m} key={m._id} onDelete={deleteMsg} />)
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