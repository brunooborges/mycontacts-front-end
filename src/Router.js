import { Route, Routes } from 'react-router-dom';

import EditContact from './pages/EditContact';
import Home from './pages/Home';
import NewContact from './pages/NewContact';

export default function Router() {
  return (
    <Routes basename='/mycontacts-front-end'>
      <Route
        path='/'
        element={<Home />}
      />
      <Route
        path='/new'
        element={<NewContact />}
      />
      <Route
        path='/edit/:id'
        element={<EditContact />}
      />
    </Routes>
  );
}
