import styled from 'styled-components';

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: ${({ theme }) => theme.colors.background};
`;

export const Card = styled.div`
  width: 100%;
  max-width: 440px;
  text-align: center;

  h2 {
    margin-bottom: 24px;
    font-size: 24px;
    color: ${({ theme }) => theme.colors.gray[900]};
  }

  strong {
    display: block;
    margin-top: 12px;
    font-size: 20px;
    color: ${({ theme }) => theme.colors.primary.main};
  }

  p {
    margin-top: 16px;
    line-height: 1.5;
    color: ${({ theme }) => theme.colors.gray[900]};
  }

  button {
    margin-top: 16px;
    padding: 12px 24px;
    border: 0;
    border-radius: 4px;
    background: ${({ theme }) => theme.colors.primary.main};
    color: #fff;
    font-weight: bold;
    cursor: pointer;

    &:hover {
      background: ${({ theme }) => theme.colors.primary.light};
    }

    &:focus-visible {
      outline: 3px solid ${({ theme }) => theme.colors.primary.dark};
      outline-offset: 2px;
    }
  }
`;

export const Track = styled.div`
  width: 100%;
  height: 12px;
  border-radius: 6px;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.gray[100]};
`;

export const Fill = styled.div`
  height: 100%;
  border-radius: 6px;
  background: ${({ theme }) => theme.colors.primary.main};
`;
