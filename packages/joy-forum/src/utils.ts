// It's used on such routes as:
//   /categories/:id
//   /categories/:id/edit
//   /threads/:id
//   /threads/:id/edit
export type UrlHasIdProps = {
  match: {
    params: {
      id: string
    }
  }
};
