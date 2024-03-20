import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import { MultiMinted } from "../generated/schema"
import { MultiMinted as MultiMintedEvent } from "../generated/YokiDispatch/YokiDispatch"
import { handleMultiMinted } from "../src/yoki-dispatch"
import { createMultiMintedEvent } from "./yoki-dispatch-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let from = Address.fromString("0x0000000000000000000000000000000000000001")
    let yokiContract = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let partnerNftContract = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let to = Address.fromString("0x0000000000000000000000000000000000000001")
    let omaAmount = BigInt.fromI32(234)
    let partnerNFTTokenId = BigInt.fromI32(234)
    let newMultiMintedEvent = createMultiMintedEvent(
      from,
      yokiContract,
      partnerNftContract,
      to,
      omaAmount,
      partnerNFTTokenId
    )
    handleMultiMinted(newMultiMintedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("MultiMinted created and stored", () => {
    assert.entityCount("MultiMinted", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "MultiMinted",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "from",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "MultiMinted",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "yokiContract",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "MultiMinted",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "partnerNftContract",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "MultiMinted",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "to",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "MultiMinted",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "omaAmount",
      "234"
    )
    assert.fieldEquals(
      "MultiMinted",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "partnerNFTTokenId",
      "234"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
