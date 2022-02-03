// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract MyERC721 is
    Context,
    Ownable,
    AccessControlEnumerable,
    ERC721Enumerable,
    ERC721Burnable,
    ERC721Pausable
{
    using Counters for Counters.Counter;
    using Strings for uint256;

    bytes32 public constant CONTROLLER_ROLE = keccak256("CONTROLLER_ROLE");

    string internal baseURI;
    Counters.Counter private _tokenIdTracker;
    string private _baseTokenURI;
    mapping(uint256 => string) private _tokenURIs;

    constructor(
        string memory name,
        string memory symbol,
        string memory baseTokenURI
    ) ERC721(name, symbol) {
        _baseTokenURI = baseTokenURI;
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(CONTROLLER_ROLE, _msgSender());
    }

    modifier onlyController() {
        require(
            hasRole(CONTROLLER_ROLE, _msgSender()),
            "Only a contract controller can call this function"
        );
        _;
    }

    function tokenIdTracker() public view virtual returns (uint256) {
        return _tokenIdTracker.current();
    }

    function contractURI() public view virtual returns (string memory) {
        return _baseURI();
    }

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(
            _exists(tokenId),
            "ERC721URIStorage: URI query for nonexistent token"
        );

        return _tokenURIs[tokenId];
    }

    function setContractURI(string memory _contractURI)
        public
        virtual
        onlyController
    {
        _baseTokenURI = _contractURI;
    }

    function setTokenURI(uint256 tokenId, string memory _tokenURI)
        public
        virtual
        onlyController
    {
        _setTokenURI(tokenId, _tokenURI);
    }

    function exists(uint256 tokenId) public view virtual returns (bool) {
        return _exists(tokenId);
    }

    function mint(address to) public virtual onlyController {
        _mint(to, _tokenIdTracker.current());
        _tokenIdTracker.increment();
    }

    function mintWithURI(address to, string memory _tokenURI) public virtual onlyController {
        _mint(to, _tokenIdTracker.current());
        _setTokenURI(_tokenIdTracker.current(), _tokenURI);
        _tokenIdTracker.increment();

    }

    function mintBatchWithURI(address[] memory recipients, string[] memory _tokenURIList)
        public
        virtual
        onlyController
    {
        for (uint256 i = 0; i < recipients.length; i++) {
            require(
                recipients[i] != address(0),
                "Must not mint to the zero address"
            );
            _mint(recipients[i], _tokenIdTracker.current());
            _setTokenURI(_tokenIdTracker.current(), _tokenURIList[i]);
            _tokenIdTracker.increment();
        }
    }

    function pause() public virtual onlyController {
        _pause();
    }

    function unpause() public virtual onlyController {
        _unpause();
    }

    function _setTokenURI(uint256 tokenId, string memory _tokenURI)
        internal
        virtual
    {
        require(
            _exists(tokenId),
            "ERC721URIStorage: URI set of nonexistent token"
        );
        _tokenURIs[tokenId] = _tokenURI;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721, ERC721Enumerable, ERC721Pausable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(AccessControlEnumerable, ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
