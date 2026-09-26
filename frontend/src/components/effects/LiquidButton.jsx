import {ArrowUpRight} from 'lucide-react';
export default function LiquidButton({children,href,onClick,secondary=false,...props}){const Tag=href?'a':'button';return <Tag className={`liquid-button ${secondary?'secondary':''}`} href={href} onClick={onClick} {...props}><span>{children}</span><ArrowUpRight size={18}/></Tag>;}
