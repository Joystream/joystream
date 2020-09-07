import { css } from 'styled-components';

const style = css`
  .JoyElection--NotRunning {
    /* nothing yet */
  }
  .JoyElection--Running {
    font-style: italic;
    color: green;
  }
  .SealedVoteTable {
    -webkit-box-shadow: 0 1px 2px 0 rgba(34,36,38,.15) !important;
    box-shadow: 0 1px 2px 0 rgba(34,36,38,.15) !important;
    tr td:first-child {
      color: #999 !important;
      font-weight: normal !important;
    }
  }
`;

export default style;
