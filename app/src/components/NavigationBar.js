import React, {Component} from 'react'
import Link from './utils/Link'
import User from './User'
import './NavigationBar.styl'

export default class NavigationBar extends Component {
  render () {
    const {user, loading, currentUrl} = this.props

    return <nav className='top-bar-container'>
      <div className='navigation-bar'>
        <Link to='/'><span className='brand' /></Link>
        <Link className={currentUrl === '/analytics' && 'active'} to='/analytics'>Analytics</Link>
        <Link className={currentUrl === '/statistics' && 'active'} to='/statistics'>Statistics</Link>
        {(!user || !user.subscription) && <Link className='pro' to='/pro'>Pro</Link>}
        <Link className={currentUrl === '/team' && 'active'} to='/team' id='team'>Team</Link>
        <Link className={currentUrl === '/support' && 'active'} to='/support'>Support us!</Link>
        <Link className={currentUrl === '/open' && 'active'} to='/open' id='open-stats'>Open</Link>
        <Link className={currentUrl === '/about' && 'active'} to='/about' id='open-stats'>About</Link>
        {loading.loadingUser && <div className='float-right'>
          <div className='spinner' />
        </div>}
        {!loading.loadingUser && <div className='float-right login-container'>
          {!user && <Link className={currentUrl === '/login' && 'active'} to='/login'>Login</Link>}
          <User user={user} loading={loading} active={currentUrl === '/profile'} />
        </div>}
      </div>
    </nav>
  }
}
