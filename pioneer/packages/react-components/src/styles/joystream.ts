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

  .ui--AddressMini {
    .ui--IdentityIcon {
      margin-left: 0;
    }
    .ui--AddressMini-info {
      display: block;
    }
    .ui--AddressMini-details {
      display: block;
      text-align: left;
    }
    .ui--AddressSummary-name,
    .ui--AddressSummary-balance,
    .ui--AddressSummary-memo {
      display: inline-block;
      margin-top: 0;
      padding-top: 0;
      font-size: 0.8rem !important;
      margin-right: 1rem;
      font-weight: 100;
      opacity: 0.8;
      overflow: hidden;
    }
  }

  .ui--Bubble.ui.label {
    background-color: #f2f2f2;
    margin: 0.25rem 0;
    margin-right: 0.5rem;

    &.pointing:before {
      background-color: #e6e6e6;
    }
    &.warn {
      color: #f2711c !important;
      border: 1px solid;
    }
    &.ok {
      color: #21ba45 !important;
      border: 1px solid;
    }
  }

  .SidebarItem {
    display: inline-flex;
    flex-direction: column;

    .SidebarSubtitle {
      display: block;
      font-size: 0.85rem;
      color: grey;
    }
  }

  .JoySection {
    margin: 2rem 0;

    .JoySection-title {
      border-bottom: 1px solid #ddd;
      margin-bottom: 1rem;
    }
  }

  .apps--SideBar-logo {
    max-height: 26px !important;
    margin: 1rem 1.5rem 2.5rem 0.75rem !important;
  }
  .collapsed .apps--SideBar-logo {
    margin: 1rem 0.75rem 2.5rem 0.5rem !important;
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
`;
