import React from 'react';
import ReactDOM from 'react-dom';
import '../../styles/modal.css';
import Button from '../../components/Button';
import Card from './Card';
import Text from '../../components/Text';
import { X } from 'lucide-react';
import Divider from '../../components/Divider';
import Spacer from '../../components/Spacer';

const Modal = ({ isOpen, onClose, children, maxHeight = '80vh', maxWidth = '50', style, title, showCLoseIcon = true }) => {
  if (!isOpen) return null;

  const combinedStyle = {
    maxHeight,
    maxWidth,
    overflowY: 'auto',
    ...style
  }

  return ReactDOM.createPortal(
    <div className="default-modal-overlay">
      <div className="default-modal-box" style={combinedStyle}>
        <Card padding='0px' borderColor="var(--color-transparent)" backgroundColor='var(--color-transparent)' positionType='relative' margin='0px 0px 3rem 0px'>
          {title && <Card positionType='absolute' position='top-left' margin='0px' padding='0px' fitContent backgroundColor='var(--color-transparent)' ><Text as="p" variant="heading3">{title}</Text></Card>}
          {showCLoseIcon && <Card positionType='absolute' position='top-right' margin='0px' size={35} backgroundColor='var(--color-danger)' onClick={onClose}><X size={15} color="var(--color-black)"  /></Card>}
        </Card>
        <Divider color='var(--color-gray)' />
        <Spacer size='md' />
        {children}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
