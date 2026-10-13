import { render } from 'preact';
import '@fontsource-variable/inter';
import './styles.css';
import { App } from './App';

render(<App />, document.getElementById('app')!);
