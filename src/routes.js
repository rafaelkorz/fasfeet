import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/multer';

import UserController from './app/controllers/UserController';
import RecipientController from './app/controllers/RecipientController';
import DeliverymanController from './app/controllers/DeliverymanController';
import DeliverymanAccessController from './app/controllers/DeliverymanAccessController';
import FileController from './app/controllers/FileController';
import OrderController from './app/controllers/OrderController';

import SessionController from './app/controllers/SessionController';

import authMiddleware from './app/middlewares/auth';

const routes = new Router();
const upload = multer(multerConfig);

routes.post('/users', UserController.store);
routes.post('/sessions', SessionController.store);
routes.put('/orders/withdraw/:id', OrderController.withdraw);
routes.put('/orders/delivered/:id', OrderController.delivered);

routes.get('/deliverymans/:id', DeliverymanAccessController.index);

routes.get(
  '/deliveryman/:deliverymanId/deliveries',
  DeliverymanAccessController.deliveries
);

routes.use(authMiddleware);

routes.post('/deliverymans', DeliverymanController.store);
routes.put('/deliverymans/:id', DeliverymanController.update);
routes.delete('/deliverymans/:id', DeliverymanController.delete);
routes.get('/deliverymans', DeliverymanController.index);

routes.post('/recipient', RecipientController.store);
routes.put('/recipient/:id', RecipientController.update);
routes.get('/recipient', RecipientController.index);

routes.post('/files', upload.single('file'), FileController.store);

routes.post('/orders', OrderController.store);
routes.get('/orders', OrderController.index);
routes.delete('/orders/:id', OrderController.delete);
routes.put('/orders/:id', OrderController.update);

routes.put('/users', UserController.update);

export default routes;
