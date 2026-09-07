export default function WeaponIcon({kind}) {
  return <svg aria-hidden="true" viewBox="0 0 40 28" className="h-6 w-full max-w-10" fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
    {kind==='grenade' ? <><path d="M17 6h7v5h-7zM23 6l5 3 2 7" fill="none"/><ellipse cx="20" cy="18" rx="8" ry="9"/><path d="M15 15h10M13 19h14M16 11v14M23 11v14" stroke="#14221b"/></>
    :kind==='pistol' ? <path d="M5 8h27v6H20l-3 11h-7l2-11H5zM22 14v5h-5"/>
    :kind==='shotgun' ? <><path d="M2 12h7l4-3h22v4H15l-6 7-7-2z"/><path d="M18 15h14" strokeWidth="3"/></>
    :kind==='rifle' ? <><path d="M2 11h8l3-3h14v6H15l-3 7H7l1-6H2zM27 10h11M18 14l3 10h5l-3-10"/><path d="M18 5h7"/></>
    :<><path d="M2 10h8l3-3h17v8H14l-3 7H7l1-7H2zM30 9h8"/><path d="M19 15h9v10h-9zM29 15l5 10"/></>}
  </svg>
}
