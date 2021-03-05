import { html, render } from 'https://unpkg.com/htm/preact/standalone.module.js'

function changeTheme() {
  if (document.body.classList.contains('dark-theme')) {
    document.body.classList.replace('dark-theme', 'light-theme')
  } else {
    document.body.classList.replace('light-theme', 'dark-theme')
  }
}

function App(props) {
  return html`
    <div>
      <h1>Hello ${props.name}!</h1>
      <a href="/spotify-login">Login</a>
      <button type="button" onclick=${() => changeTheme()}>Switch Theme</button>
    </div>
  `
}

render(html`<${App} name="Myles" />`, document.querySelector('main'))
console.log('example!!!')
