'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Loader2, User, Eye, EyeOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { generateWebProof } from '@/lib/proof'

const logoAddress = "https://static.biznes.gov.pl/styleguide/v1.7.39/img/Godlo_Rzeczypospolitej_Polskiej@2x.png"

export default function Component() {
  const [loginState, setLoginState] = useState<'initial' | 'loading' | 'logged-in'>('initial')
  const [showAddress, setShowAddress] = useState(false)
  const walletAddress = '0x13k3...'

  const handleLogin = () => {
    setLoginState('loading')
    // Simulate login delay
    setTimeout(() => {
      setLoginState('logged-in')
    }, 2000)
  }

  if (loginState === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-4">
        <Image
          src={logoAddress}
          alt="Polish Coat of Arms"
          width={200}
          height={240}
          priority
        />
        <div className="flex items-center gap-2 rounded-lg border-2 border-[#4339F2] px-8 py-3 text-[#4339F2]">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Signing in, please wait</span>
        </div>
      </div>
    )
  }

  if (loginState === 'logged-in') {
    return (
      <div className="min-h-screen p-4">
        <header className="flex items-center justify-between">
          <Image
            src={logoAddress}
            alt="Polish Coat of Arms"
            width={48}
            height={56}
          />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-lg border-2 border-[#4339F2] px-4 py-2">
              <span className="text-[#4339F2]">{showAddress ? '0x13k3...f29d' : '0x13k3...'}</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-[#4339F2]"
                onClick={() => setShowAddress(!showAddress)}
              >
                {showAddress ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="ml-1">Show</span>
              </Button>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="h-5 w-5" />
              <span className="sr-only">Profile</span>
            </Button>
          </div>
        </header>
        <main className="flex flex-1 items-center justify-center pt-32">
          <Button
            className="bg-[#4339F2] px-8 py-6 text-lg hover:bg-[#4339F2]/90"
            onClick={() => alert('Send ETH clicked')}
          >
            Send ETH
          </Button>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-4">
      <Image
        src={logoAddress}
        alt="Polish Coat of Arms"
        width={200}
        height={240}
        priority
      />
      <Button
        className="bg-[#4339F2] px-8 py-6 text-lg hover:bg-[#4339F2]/90"
        // onClick={() => generateWebProof()}
        onClick={() => handleLogin()}
      >
        Login with gov.pl
      </Button>
    </div>
  )
}