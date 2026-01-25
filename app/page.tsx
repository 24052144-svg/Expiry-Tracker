"use client"

import React from 'react'
import Link from 'next/link'

export default function HomePage() {
	return (
		<main style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f6f8fb', padding: 24}}>
			<div style={{maxWidth: 900, width: '100%', textAlign: 'center'}}>
				<div style={{background: '#fff', padding: 40, borderRadius: 12, boxShadow: '0 10px 30px rgba(2,6,23,0.08)'}}>
					<h1 style={{fontSize: 36, margin: 0, marginBottom: 8}}>Expiry Tracker</h1>
					<p style={{marginTop: 0, marginBottom: 24, color: '#475569'}}>Track expiry dates, get reminders and reduce waste.</p>

					<div style={{display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap'}}>
						<Link href="/login">
							<button style={{cursor: 'pointer', padding: '10px 20px', borderRadius: 8, border: 'none', background: '#2563eb', color: 'white', fontWeight: 600}}>Log in</button>
						</Link>

						<Link href="/register">
							<button style={{cursor: 'pointer', padding: '10px 20px', borderRadius: 8, border: '2px solid #2563eb', background: 'transparent', color: '#2563eb', fontWeight: 600}}>Register</button>
						</Link>
					</div>

					<p style={{marginTop: 28, color: '#64748b', fontSize: 14}}>Already have an account? Use Log in. New here? Register to start tracking items.</p>
				</div>
			</div>
		</main>
	)
}

