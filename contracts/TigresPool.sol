// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract TigresPool is Initializable, ERC20Upgradeable, OwnableUpgradeable, UUPSUpgradeable {
    IERC20Upgradeable public immutable token0;
    IERC20Upgradeable public immutable token1;

    uint256 public reserve0;
    uint256 public reserve1;
    uint256 public poolTokenReserve;

    event Swap(address indexed _trader, address indexed _token, uint256 indexed _tradeValue);

    /// @custom:oz-upgrades-unsafe-allow constructor
    // constructor() {
    //     _disableInitializers();
    // }

    constructor (
        IERC20Upgradeable _token0,
        IERC20Upgradeable _token1
    ) {
        token0 = _token0;
        token1 = _token1;
    }

    function swap(address _tokenIn, uint256 _amountIn)
        external
        returns (uint256 amountOut)
    {
        require(
            _tokenIn == address(token0) || _tokenIn == address(token1),
            "Invalid token being swapped"
        );
        require(
            _amountIn > 0,
            "Amount of token being swapped must be greater than 0"
        );

        bool isToken0 = _tokenIn == address(token0);

        (
            IERC20Upgradeable tokenIn,
            IERC20Upgradeable tokenOut,
            uint256 reserveIn,
            uint256 reserveOut
        ) = isToken0 
                ? (token0, token1, reserve0, reserve1)
                : (token1, token0, reserve1, reserve0);

        // tokenIn.approve(address(this), _amountIn);
        tokenIn.transferFrom(msg.sender, address(this), _amountIn);

        uint256 amountInWithFee = (_amountIn * 997) / 1000;
        amountOut =
            (reserveOut * amountInWithFee) /
            (reserveIn + amountInWithFee);

        tokenOut.transfer(msg.sender, amountOut);

        _updatePool(
            token0.balanceOf(address(this)),
            token1.balanceOf(address(this))
        );
        emit Swap(msg.sender, _tokenIn, _amountIn);

    }

    function initialize() initializer public {
        __ERC20_init("poolTigres", "pTG");
        __Ownable_init();
        __UUPSUpgradeable_init();

        _mint(msg.sender, 1000000 * 10 ** decimals());

    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyOwner
        override
    {}

    function _updatePool(uint256 _reserve0, uint256 _reserve1) private {
        reserve0 = _reserve0;
        reserve1 = _reserve1;
    }
}