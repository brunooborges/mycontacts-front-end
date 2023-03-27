import { Link } from 'react-router-dom';

import { Card, Container, Header, InputSearchContainer, ListContainer } from './styles';

import arrow from '../../assets/images/icons/arrow.svg';
import edit from '../../assets/images/icons/edit.svg';
import trash from '../../assets/images/icons/trash.svg';
import Loader from '../../components/Loader';
import Modal from '../../components/Modal';

export default function Home() {
  return (
    <Container>
      <InputSearchContainer>
        <input
          type='text'
          placeholder='Pesquisar contato...'
        />
      </InputSearchContainer>

      <Header>
        <strong>3 contatos</strong>
        <Link to='/new'>Novo contato</Link>
      </Header>

      <ListContainer>
        <header>
          <button type='button'>
            <span>Nome</span>
            <img
              src={arrow}
              alt='Arrow'
            />
          </button>
        </header>

        <Card>
          <div className='info'>
            <div className='contact-name'>
              <strong>Bruno Borges</strong>
              <small>instagram</small>
            </div>
            <span>bruno@mail.com.br</span>
            <span>(64)99999-9999</span>
          </div>
          <div className='actions'>
            <Link to='/edit/123'>
              <img
                src={edit}
                alt='Edit'
              />
            </Link>
            <button type='button'>
              <img
                src={trash}
                alt='Delete'
              />
            </button>
          </div>
        </Card>
      </ListContainer>
    </Container>
  );
}
