import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/multer';

import UserController from './app/controllers/UserController';
import RecipientController from './app/controllers/RecipientController';
import DeliverymansController from './app/controllers/DeliverymansController';
import FileController from './app/controllers/FileController';

import SessionController from './app/controllers/SessionController';

import authMiddleware from './app/middlewares/auth';

const routes = new Router();
const upload = multer(multerConfig);

routes.post('/users', UserController.store);
routes.post('/sessions', SessionController.store);

routes.use(authMiddleware);

routes.post('/deliverymans', DeliverymansController.store);
routes.put('/deliverymans/:id', DeliverymansController.update);
routes.delete('/deliverymans/:id', DeliverymansController.delete);
routes.get('/deliverymans', DeliverymansController.index);

routes.post('/recipient', RecipientController.store);
routes.put('/recipient/:id', RecipientController.update);

routes.post('/files', upload.single('file'), FileController.store);

routes.put('/users', UserController.update);

export default routes;
