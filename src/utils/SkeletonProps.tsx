export const useSkeletonCommonProps = () => {

  return {
    colorMode: 'dark',
    highlightColor: "#3a3a3c",
    transition: {
      type: 'timing',
      duration: 1300,
    },
    backgroundColor: "#23292D"
  } as const;
};
