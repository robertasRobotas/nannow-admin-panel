type EuroCircleIconProps = {
  className?: string;
};

const EuroCircleIcon = ({ className }: EuroCircleIconProps) => {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path
        d="M15.9 8.6C15.15 7.62 14.07 7.1 12.85 7.1C10.95 7.1 9.46 8.27 8.94 10.1H15.2V11.5H8.72C8.71 11.65 8.7 11.82 8.7 12C8.7 12.18 8.71 12.35 8.72 12.5H15.2V13.9H8.94C9.46 15.73 10.95 16.9 12.85 16.9C14.07 16.9 15.15 16.38 15.9 15.4L16.98 16.33C15.96 17.63 14.48 18.4 12.85 18.4C10.16 18.4 7.95 16.61 7.34 13.9H5.8V12.5H7.13C7.12 12.34 7.1 12.17 7.1 12C7.1 11.83 7.12 11.66 7.13 11.5H5.8V10.1H7.34C7.95 7.39 10.16 5.6 12.85 5.6C14.48 5.6 15.96 6.37 16.98 7.67L15.9 8.6Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default EuroCircleIcon;
