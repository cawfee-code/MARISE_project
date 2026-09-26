export function Facts({items}){return <dl className="facts">{items.map(([name,value])=><div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl>;}
export function Note({children}){return <p className="science-note">{children}</p>;}
