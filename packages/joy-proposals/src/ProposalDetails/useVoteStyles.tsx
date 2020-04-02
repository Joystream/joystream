export default function useVoteStyles(value) {
  let textColor;
  let icon;
  let color;

  switch (value) {
    case "Approve": {
      icon = "smile";
      color = "green";
      textColor = "text-green";
      break;
    }
    case "Abstain": {
      icon = "meh";
      color = "grey";
      textColor = "text-grey";
      break;
    }
    case "Reject": {
      icon = "frown";
      color = "orange";
      textColor = "text-orange";
      break;
    }
    case "Slash": {
      icon = "times";
      color = "red";
      textColor = "text-red";
      break;
    }
  }

  return { textColor, color, icon };
}
