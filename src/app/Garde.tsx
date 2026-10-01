import { Component, type ReactNode } from 'react';

/** Affiche l'erreur (au lieu d'un écran vide) si une vue plante, avec un bouton pour repartir. */
export class Garde extends Component<{ children: ReactNode; cle?: string }, { erreur: Error | null; pile?: string }> {
  state: { erreur: Error | null; pile?: string } = { erreur: null };

  componentDidCatch(_: Error, info: { componentStack?: string | null }) {
    this.setState({ pile: info.componentStack ?? undefined });
  }

  static getDerivedStateFromError(erreur: Error) {
    return { erreur };
  }

  componentDidUpdate(prev: { cle?: string }) {
    // Changer de vue efface l'erreur.
    if (prev.cle !== this.props.cle && this.state.erreur) this.setState({ erreur: null });
  }

  render() {
    const { erreur } = this.state;
    if (!erreur) return this.props.children;
    return (
      <div className="encadre erreur" role="alert">
        <h3>Cet affichage a rencontré une erreur</h3>
        <p>Le reste du simulateur fonctionne. Merci de signaler ce message :</p>
        <pre>
          {erreur.message}
          {'\n'}
          {(erreur.stack ?? '').split('\n').slice(0, 6).join('\n')}
          {this.state.pile ? `\n${this.state.pile.trim().split('\n').slice(0, 8).join('\n')}` : ''}
          {`\n${navigator.userAgent}`}
        </pre>
        <button type="button" className="bouton principal" onClick={() => this.setState({ erreur: null })}>
          Réessayer
        </button>{' '}
        <button
          type="button"
          className="bouton secondaire"
          onClick={() => {
            try {
              history.replaceState(null, '', '#');
            } catch {
              /* aperçu */
            }
            location.reload();
          }}
        >
          Repartir de zéro
        </button>
      </div>
    );
  }
}
