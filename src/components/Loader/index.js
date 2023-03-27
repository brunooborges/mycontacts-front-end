import ReactDOM from 'react-dom';

import { Overlay } from './styles';

export default function Loader() {
  return ReactDOM.createPortal(
    <Overlay>
      <div className='loader'></div>
    </Overlay>,
    document.getElementById('loader-root'),
  );
}
