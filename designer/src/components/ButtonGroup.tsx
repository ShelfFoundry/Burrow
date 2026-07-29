import type { JSXElement } from "solid-js";
import "../styles/button-group.css";

type ButtonGroupProps = {
  children: JSXElement;
};

export function ButtonGroup(props: ButtonGroupProps) {
  return <div class="button-group">{props.children}</div>;
}
