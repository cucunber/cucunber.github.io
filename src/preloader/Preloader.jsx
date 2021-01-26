import React from 'react';
import classes from './Preloader.module.css';
import preloader from '../imgs/preloader.svg';

const Preloader = (props) => {
    return(
    <div className={classes.loader}>
        <img src={preloader}/>
    </div>
    )
}

export default Preloader