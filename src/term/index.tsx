import { useState, useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { invoke } from '@tauri-apps/api';
import { Event, UnlistenFn, listen } from '@tauri-apps/api/event';

export default () => {
  const [term, setTerm] = useState<Terminal>();
  const [fit, setFit] = useState<FitAddon>();
  const terminalElement = useRef(null);

  useEffect(() => {
    const fitAddon = new FitAddon();
    const terminal = new Terminal({
      fontFamily: 'Jetbrains Mono',
      theme: {
        background: 'transparent',
      },
    });

    terminal.loadAddon(fitAddon);
    // @ts-ignore
    terminal.open(terminalElement.current);

    // Add event listeners
    terminal.onData((data) => writeToPty(data));
    let unlisten: UnlistenFn;
    listen('data', (ev: Event<string>) => writeToTerminal(terminal, ev)).then((fn) => (unlisten = fn));

    setTerm(terminal);
    setFit(fitAddon);
    fitTerminal(terminal, fitAddon);

    return () => {
      // Remove event listeners
      terminal.dispose();
      if (unlisten) {
        unlisten();
      }
    };
  }, []);

  return (
    <div
      onResize={() => {
        if (!term || !fit) return;
        fitTerminal(term, fit);
      }}
      className="terminal"
      ref={terminalElement}
    ></div>
  );
};

// Write data from pty into the terminal
function writeToTerminal(term: Terminal, ev: Event<string>) {
  term.write(ev.payload);
}

// Write data from the terminal to the pty
function writeToPty(data: any) {
  invoke('async_write_to_pty', {
    data,
  });
}

// Make the terminal fit all the window size
function fitTerminal(term: Terminal, fitAddon: FitAddon) {
  fitAddon.fit();
  void invoke('async_resize_pty', {
    rows: term.rows,
    cols: term.cols,
  });
}
