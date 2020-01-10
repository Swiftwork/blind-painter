export class Server {
  static NewSession(host: boolean, code?: string) {
    return host
      ? fetch(`/sessions`, {
          method: 'POST',
        }).then(res =>
          res.json().then((data: { sessionId: string }) => {
            return Server.JoinSession(data.sessionId);
          }),
        )
      : Server.JoinSession(code);
  }

  static JoinSession(code?: string) {
    return fetch(`/sessions/${code}`, {
      method: 'PUT',
    });
  }
}
