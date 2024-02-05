export interface IAppProps {
  name?: string;
}

export default function EDCT(props: IAppProps) {
  return <div>{props.name ?? ""}</div>;
}
