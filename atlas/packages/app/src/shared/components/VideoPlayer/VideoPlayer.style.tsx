import styled from '@emotion/styled'
import { colors, spacing, typography } from '../../theme'
import { PlayIcon } from '../../icons'

export const Container = styled.div`
  position: relative;

  *:focus {
    outline: none;
  }

  .vjs-control-bar {
    font-family: ${typography.fonts.base};
    background-color: rgba(0, 0, 0, 0.3);
    height: ${spacing.xxxxxl} !important;
    align-items: center;

    /* account for progress bar on top */
    padding: 5px ${spacing.xxl} 0;

    .vjs-control {
      height: 30px;

      .vjs-icon-placeholder ::before {
        line-height: 1.25;
        font-size: ${typography.sizes.icon.xlarge};
      }
    }

    .vjs-time-control {
      display: inline-block;
      font-size: ${typography.sizes.caption};
      user-select: none;
      height: unset;
    }
    .vjs-play-control {
      order: -5;
    }
    .vjs-current-time {
      order: -4;
      padding-right: 0;
    }
    .vjs-time-divider {
      order: -3;
      padding: 0 4px;
      min-width: 0;
    }
    .vjs-duration {
      order: -2;
      padding-left: 0;
    }
    .vjs-volume-panel {
      order: -1;
    }
    .vjs-remaining-time {
      display: none;
    }

    .vjs-picture-in-picture-control {
      margin-left: auto;
    }

    .vjs-slider {
      background-color: ${colors.gray[400]};

      .vjs-slider-bar,
      .vjs-volume-level {
        background-color: ${colors.blue[500]};
      }
    }

    .vjs-progress-control {
      position: absolute;
      top: 0;
      left: ${spacing.xxl};
      width: calc(100% - 2 * ${spacing.xxl});
      height: 5px;

      .vjs-progress-holder {
        height: 100%;
        margin: 0;

        .vjs-play-progress ::before {
          display: none;
        }

        .vjs-load-progress {
          background-color: ${colors.gray[200]};

          div {
            background: none;
          }
        }
      }
    }

    .vjs-volume-control {
      width: 72px !important;
      .vjs-volume-bar {
        width: 72px;
        margin-left: 0;
        margin-right: 0;
        height: 4px;
        .vjs-volume-level {
          height: 4px;
          ::before {
            font-size: ${typography.sizes.icon.small};
            top: -0.25em;
          }
        }
      }
    }
  }

  .vjs-big-play-button {
    display: none !important;
  }
`

export const PlayOverlay = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 100;

  background: linear-gradient(0deg, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6));

  display: flex;
  justify-content: center;
  align-items: center;

  cursor: pointer;
`

export const StyledPlayIcon = styled(PlayIcon)`
  height: 72px;
  width: 72px;
`
