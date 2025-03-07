import { Scanner } from '../src'
import { waitFor } from '@testing-library/react'

describe('Scanner', (): void => {
  it('should test scanner', async (): Promise<void> => {
    const args = { bonjour: false, hbmScan: false, pndcp: false, upnp: false }
    const scan = new Scanner(args)
    scan.emit = jest.fn()
    scan.startScanning(args)
    await waitFor(() => {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(scan.emit).toHaveBeenCalledWith(5)
    })
  })
})
