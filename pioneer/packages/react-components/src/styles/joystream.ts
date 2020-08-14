import { css } from 'styled-components';

export default css`
  .text.muted,
  .text.grey,
  .text.grey a {
    color: #999999;
  }

  .text.smaller {
    font-size: 0.9rem;
  }

  .ui.button:disabled,
  .ui.buttons .disabled.button,
  .ui.disabled.active.button,
  .ui.disabled.button,
  .ui.disabled.button:hover {
    opacity: 0.45 !important;
  }

  .ui--row {
    .ui.message {
      margin: 0;
      padding: 0.7rem 1rem;
    }
    textarea,
    .ui--InputFile {
      margin: 0.25rem 0 !important;
      height: 5rem;
    }
  }

  .JoySection {
    margin: 2rem 0;

    .JoySection-title {
      border-bottom: 1px solid #ddd;
      margin-bottom: 1rem;
    }
  }

  .JoyForm {
    margin-bottom: 1.5rem;

    .ui--Labelled {
      align-items: end;
      & > label {
        padding-top: 0.75rem;
      }
    }
  }

  /* MD = markdown */
  .JoyViewMD {
    img {
      max-width: 100%;
    }
    code {
      background-color: #e0e0e0;
      padding: 0 0.25rem;
      border-radius: 2px;
    }
  }

  .JoyMainStatus {
    margin: 1rem auto !important;
    max-width: 500px !important;
    width: 100% !important;
    text-align: center;

    .button {
      margin-right: 0;
    }
  }

  .JoyInlineActions {
    white-space: "nowrap";
  }

  .FlexCenter {
    display: flex;
    align-items: center;
  }

  .ui.dropdown button {
    width: 100% !important;
    background-color: transparent !important;
    &:hover {
      background-color: rgba(0, 0, 0, 0.05) !important;
    }
    .icon {
      margin-left: 0 !important;
      margin-right: 0.78571429rem !important;
    }
  }

  /* Semantic UI Colors*/
  .text-white {
    color: #ffffff;
  }
  /* Commented otherwise it overrides the text-grey above
  .text-grey {
    color: #9d9d9d;
  } */
  .text-black {
    color: #1b1c1d;
  }
  .text-yellow {
    color: #f2c61f;
  }
  .text-teal {
    color: #00b5ad;
  }
  .text-red {
    color: #d95c5c;
  }
  .text-purple {
    color: #564f8a;
  }
  .text-pink {
    color: #d9499a;
  }
  .text-orange {
    color: #e07b53;
  }
  .text-green {
    color: #5bbd72;
  }
  .text-blue {
    color: #3b83c0;
  }

  /* Remove IdentityIcon border (not working well for members list) */
  .ui--IdentityIcon {
    border: none !important;
  }

  .apps--SideBar-Item-NavLink {
    /* Normalize SideBar icons width */
    svg {
      width: 20px !important;
    }
    /* Display SideBar subtitle below title */
    .text {
      display: inline-flex;
      flex-direction: column;
    }
  }

  /* Fix "collapsed" sidebar on mobile */
  .apps--Wrapper:not(.menu-open) .apps--SideBar-Scroll {
    padding: 0 !important;
  }

  /* Turn off global text-transform on h1 */
  h1 {
    text-transform: none;
  }

  /* AddressMini customization */
  .ui--AddressMini {
    display: grid;
    grid-template-rows: auto auto;
    grid-template-columns: min-content min-content;
    .ui--AddressMini-icon {
      grid-row: 1/3;
      grid-column: 2/3;
      align-self: center;
    }
    .ui--AddressMini-balances .ui--FormatBalance {
      font-size: 1rem !important;
      margin: 0 !important;
    }
    .ui--AddressMini-info {
      min-width: 10em;
      max-width: 10em;
    }
  }
`;
