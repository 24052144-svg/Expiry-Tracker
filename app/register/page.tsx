"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
    const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter() // handles navigation

    const handleSubmit = async (e: React.FormEvent) => {
        // form submit event

        e.preventDefault() // prevents from refreshing
        setError('') // Ensures old errors don’t stay visible when the user tries again.

        const { name, email, password, confirmPassword } = form
        if (!name || !email || !password || !confirmPassword) return setError('All fields are required')
        if (password !== confirmPassword) return setError('Passwords do not match')
        try {
            setLoading(true) // Disable the submit button ,Show a spinner or “Registering….
            const res = await fetch('/api/register', { method: 'POST', body: JSON.stringify({ name, email, password, confirmPassword }) })
            
            // Sends an HTTP request to your backend API at /api/register.
            // method: 'POST' → sending data to the server
            // converts the JavaScript object into JSON text
            
            const data = await res.json() //Reads the response body from the server,
            // Converts JSON response into a JavaScript object.
            setLoading(false)
            if (!res.ok) return setError(data.error || 'Registration failed')
           // If the request failed:Shows the server error message

            router.push('/login')// Redirects the user to the /login page.
            // Happens only if registration was successful.
        } catch (err) {
            console.error("Register error:", err)
            setLoading(false) // Turns off the loading state.
            // Ensures that the submit button is re-enabled

            setError('An error occurred')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[url('/assets/background.svg')] bg-cover bg-center">
            <div className="w-full max-w-md p-6">
                <div className="bg-white/95 rounded-2xl shadow-xl p-8 border border-white/50">
                    <h2 className="text-2xl font-bold mb-2 text-gray-900">Create your account</h2>
                    <p className="text-sm text-gray-600 mb-6">Register to start tracking expiry dates</p>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">Name</label>
                            <input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                // Runs every time the user types in the input,e is the change event,
                                // Used to update state when the input changes.

                                // { ...form }-->Copies all existing form fields, Prevents other fields from being erased.

                                // name: e.target.value-->Updates only the name field with the new value.
                                className="w-full px-4 py-3 border rounded-lg"
                                placeholder="Your name"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="w-full px-4 py-3 border rounded-lg"
                                placeholder="you@example.com"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">Password</label>
                            <input
                                type="password"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                className="w-full px-4 py-3 border rounded-lg"
                                placeholder="Choose a password"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">Confirm Password</label>
                            <input
                                type="password"
                                value={form.confirmPassword}
                                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                                className="w-full px-4 py-3 border rounded-lg"
                                placeholder="Confirm your password"
                                required
                            />
                        </div>

                        {error && <div className="text-red-600 text-sm p-2 bg-red-50 rounded">{error}</div>}
                         {/* If error exists (is not an empty string), show this div */}
                        <button
                            type="submit"
                            disabled={loading}// Disables the button when loading === true.
                            className="w-full py-3 bg-[#2563eb] text-white rounded-lg font-medium"
                        >
                            {loading ? 'Creating...' : 'Register'}
                             {/* If loading is true:Button text = "Creating..." */}
                            
                        </button>

                        <p className="text-sm text-center text-gray-600">Already have an account? <a href="/login" className="text-[#2563eb] font-medium">Log in</a></p>
                    </form>
                </div>
            </div>
        </div>
    )
}