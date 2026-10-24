type HeaderProps = {
  status: string;
};

export function Header(props: HeaderProps) {
  return (
    <header class="flex items-center justify-between gap-4 border-b border-border bg-surface px-5">
      <h1 class="text-[17px] font-medium text-fg-strong">Burrow Designer</h1>
      <p class="truncate text-xs text-fg-muted" role="status">
        {props.status}
      </p>
    </header>
  );
}
