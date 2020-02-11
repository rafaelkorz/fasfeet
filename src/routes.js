import { Router } from 'express';

import UserController from './app/controllers/UserController';
import RecipientController from './app/controllers/RecipientController';
import DeliverymansController from './app/controllers/DeliverymansController';

import SessionController from './app/controllers/SessionController';

import authMiddleware from './app/middlewares/auth';

const routes = new Router();

routes.post('/users', UserController.store);
routes.post('/sessions', SessionController.store);

routes.use(authMiddleware);

routes.post('/deliverymans', DeliverymansController.store);
routes.put('/deliverymans/:id', DeliverymansController.update);
routes.delete('/deliverymans/:id', DeliverymansController.delete);
routes.get('/deliverymans', DeliverymansController.index);

routes.post('/recipient', RecipientController.store);

routes.put('/users', UserController.update);

export default routes;
