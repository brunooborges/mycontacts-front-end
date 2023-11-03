import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';

import GlobalStyles from '../../assets/styles/global';
import defaultTheme from '../../assets/styles/Themes/default';

import Router from '../../Router';
import Header from '../Header';
import ToastContainer from '../Toast/ToastContainer';

import { Container } from './styles';

function App() {
  return (
    <BrowserRouter basename='/mycontacts-front-end'>
      <ThemeProvider theme={defaultTheme}>
        <ToastContainer />
        <GlobalStyles />

        <Container>
          <Header />
          <Router />
        </Container>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
