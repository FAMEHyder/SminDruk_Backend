import express from 'express';
import Register from '../Controllers/user.controller.js';
import {login,getUserById} from '../Controllers/user.controller.js'


const router = express.Router()
router.post('/register',Register)
router.post('/login' ,login)
router.get('/login/:id' ,getUserById)


export default router;