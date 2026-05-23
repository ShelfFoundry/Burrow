type StatusBarProps = {
  message: string;
};

export function StatusBar(props: StatusBarProps) {
  return <footer class="status-bar">{props.message}</footer>
}
